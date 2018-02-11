import { Component, OnInit } from '@angular/core';
import { ControlProperties, ChildControls } from './controlproperties';
import { FormGroup } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { FieldLogicList } from './fieldLogic';
import { NgProgress } from '@ngx-progressbar/core';
import { SimpleModalService } from 'ngx-simple-modal';
import { UiPropertiesModalComponent } from './ui-properties.component';
import { ActivatedRoute, Router } from '@angular/router';
import { LocalService } from '../shared/services/localJson.service';

@Component({
	selector: 'app-ui-form',
	templateUrl: './ui-form.component.html',
	styleUrls: [ './ui-form.component.css' ]
})
export class UiFormComponent implements OnInit {
	controls = [
		{ name: 'section', type: 'section', dspname: 'section', template: '<h4>section</h4>', id: 0, controls: [], className: 'col-xs-8 col-sm-8 col-md-10 col-lg-10 inline-section-header' },
		{ name: 'input', type: 'htmlcontrol', dataType: 'input', className: 'col-sm-6', dspname: 'input', id: 0, label: 'input' },
		{ name: 'select', type: 'htmlcontrol', dataType: 'select', className: 'col-sm-6', dspname: 'select', id: 0, label: 'select' },
		{ name: 'checkbox', type: 'htmlcontrol', dataType: 'checkbox', className: 'col-sm-6', dspname: 'checkbox', id: 0, label: 'checkbox' },
		{ name: 'radio button', type: 'htmlcontrol', dataType: 'radio', className: 'col-sm-6', dspname: 'radio', id: 0, label: 'radio' }
	];
	tabs = [ { name: 'Code', class: 'active' }, { name: 'Preview Code', class: '' }, { name: 'Paste Json', class: '' } ];
	count = 1;
	droppedControls: ControlProperties[] = [];
	properties: any;
	formlyField: any = [];
	public fields: any;
	public model: any = {
		Application__c: {},
		Employment_Information__c: {},
		Identity_Information__c: {},
		About_Account__c: {}
	};
	pageTitle: any = '';
	form = new FormGroup({});
	downLoadUrl: any;
	pastedJSON: any;
	fileName: any;
	formlyJson: any;
	subProdCode: any;
	constructor(private sanitizer: DomSanitizer, private progress: NgProgress, private SimpleModalService: SimpleModalService, private route: ActivatedRoute, public service: LocalService, private router: Router) {}
	ngOnInit() {
		this.pageTitle = this.route.snapshot.queryParams['page'];
		this.subProdCode = this.route.snapshot.queryParams['subProd'];
		if (!this.subProdCode || this.subProdCode.length === 0) {
			this.router.navigate([ '/ui-start' ]);
		} else {
			this.onPageLoadGetJson();
		}
		setTimeout(() => {
			this.progress.done();
		}, 100);
	}

	onControlDrop(e: any) {
		this.count++;
		const obj2 = Object.assign({}, e.dragData);
		obj2.id = this.count;
		obj2.controls = [];
		this.droppedControls.push(obj2);
	}

	onChildDrop(e: any, index) {
		if (e.dragData && e.dragData.type === 'htmlcontrol') {
			this.count++;
			const obj2 = Object.assign({}, e.dragData);
			obj2.id = this.count;
			this.droppedControls[index].controls.push(obj2);
		}
	}

	getProperty(item, $event) {
		// this.removeClassNames('.activeElement');
		// $event.target.classList.add('activeElement');
		// this.properties = item;
		this.SimpleModalService.addModal(
			UiPropertiesModalComponent,
			{ properties: item },
			{
				closeOnEscape: false,
				closeOnClickOutside: false
			}
		);
	}
	makeActive(index) {
		for (let i = 0; i < this.tabs.length; i++) {
			if (index === i) {
				this.tabs[i]['class'] = 'active';
			} else {
				this.tabs[i]['class'] = '';
			}
		}
		this.ConvertToFormly(index);
	}

	ConvertToFormly(index) {
		this.formlyField = [];

		if (index === 1) {
			this.droppedControls.forEach((item) => {
				const header = {
					template: item.template,
					className: item.className
				};
				if (item.sectionName) {
					header['data'] = {
						sectionType: item.sectionName
					};
				}
				const section = {
					wrappers: 'section',
					fieldGroupClassName: 'row',
					fieldGroup: []
				};
				item.controls.forEach((child) => {
					const field = {
						key: child.dspname,
						type: child.dataType,
						className: child.className,
						templateOptions: {
							label: child.label,
							required: child.required,
							objectName: child.objectName,
							fieldName: child.fieldName
						}
					};
					if (child.defaultValue) {
						field['defaultValue'] = child.defaultValue;
					}
					if (child.expressionProperties) {
						field['expressionProperties'] = child.expressionProperties;
					}
					if (child.hideExpression) {
						field['hideExpression'] = child.hideExpression;
					}
					if (child.data) {
						field['data'] = child.data;
					}
					if (child.picklist) {
						const values = child.picklist.split(';');
						const options = [];
						values.forEach((val) => {
							options.push({ label: val, value: val });
						});
						field['templateOptions']['options'] = options;
					}
					section.fieldGroup.push(field);
				});
				this.formlyField.push(header);
				this.formlyField.push(section);
			});
			this.fields = JSON.parse(JSON.stringify(this.formlyField));
		}
		if (index === 2) {
			this.pastedJSON = JSON.stringify(this.droppedControls, null, 2);
		}
	}
	saveWork() {
		this.ConvertToFormly(1);
		this.saveToFileSystem(JSON.stringify(this.formlyField, null, 2));
	}
	finish() {
		const sales = new FieldLogicList();
		sales.genrateFieldLogic(this.droppedControls);
	}

	removeChild(k, x) {
		this.droppedControls[k].controls.splice(x, 1);
	}

	remove(k) {
		this.droppedControls.splice(k, 1);
	}
	loadPastedJson() {
		this.droppedControls = JSON.parse(this.pastedJSON);
	}

	private saveToFileSystem(response) {
		// this.fileName = this.pageTitle.toLowerCase().replace(' ', '-') + '.json';
		// const blob = new Blob([ response ], { type: 'application/json' });
		// const url = window.URL.createObjectURL(blob);
		// const uri = this.sanitizer.bypassSecurityTrustUrl(url);
		// this.downLoadUrl = uri;
		// setTimeout(function() {
		// 	document.getElementById('down').click();
		// 	window.URL.revokeObjectURL(url);
		// }, 200);
		if (response !== '[]' && this.pageTitle.length > 0) {
			const parms = {};
			parms['json'] = response;
			parms['subProductCode'] = this.subProdCode;
			parms['pageName'] = this.pageTitle;
			console.log(parms);
			const domain = document.location.hostname.indexOf('localhost') >= 0 ? 'local' : 'remote';
			if (domain !== 'local') {
				this.service.callExternalMethod('saveAppFields', parms).subscribe((result) => {
					this.goBack();
				});
			} else {
				this.goBack();
			}
		}
	}

	onPageLoadGetJson() {
		const domain = document.location.hostname.indexOf('localhost') >= 0 ? 'local' : 'remote';
		if (domain !== 'local') {
			const parms = {};
			parms['subProductCode'] = this.subProdCode;
			parms['pageName'] = this.pageTitle;
			this.service.callExternalMethod('getAppFields', parms).subscribe((result) => {
				this.formlyJson = result['fields'];
				this.convertFormlyJsonToDrop();
			});
		}
	}

	convertFormlyJsonToDrop() {
		const jsonData = JSON.parse(this.formlyJson);
		this.droppedControls = [];
		let section: ControlProperties;
		jsonData.forEach((item) => {
			if (item.template) {
				section = {
					sectionName: item.data ? item.data.sectionType : '',
					template: item.template,
					name: 'section',
					className: item.className,
					controls: []
				};
			}
			if (item.fieldGroup) {
				item.fieldGroup.forEach((child) => {
					const field: ChildControls = {
						dspname: child.key,
						name: child.type,
						type: child.type,
						dataType: child.type,
						required: child.templateOptions.required,
						label: child.templateOptions.label,
						className: child.className,
						objectName: child.templateOptions.objectName,
						fieldName: child.templateOptions.fieldName,
						hideExpression: child.hideExpression,
						data: child.data,
						defaultValue: child.defaultValue,
						expressionProperties: child.expressionProperties
					};
					section.controls.push(field);
				});
			}
			if (section && section.controls.length > 0) {
				this.droppedControls.push(section);
			}
		});
	}

	removeClassNames(cls) {
		const elements = document.querySelectorAll(cls);
		elements.forEach((ele) => {
			ele.classList.remove(cls.replace('.', ''));
		});
	}
	goBack() {
		this.router.navigateByUrl('/ui-start/' + this.subProdCode);
	}
}
